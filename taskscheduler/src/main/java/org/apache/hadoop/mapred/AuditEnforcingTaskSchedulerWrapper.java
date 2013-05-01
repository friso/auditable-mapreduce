package org.apache.hadoop.mapred;

import java.io.IOException;
import java.util.Collection;
import java.util.List;

import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.FSDataInputStream;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.mapred.AuditServerHttpClient.AuditServerResponse;
import org.apache.hadoop.mapreduce.server.jobtracker.TaskTracker;
import org.apache.hadoop.util.ReflectionUtils;

public class AuditEnforcingTaskSchedulerWrapper extends TaskScheduler {
	private TaskScheduler actualScheduler;
	private Configuration configuration;
	private AuditServerHttpClient client;
	
	private static final Log log = LogFactory.getLog(AuditEnforcingTaskSchedulerWrapper.class);
	
	AuditEnforcingTaskSchedulerWrapper() {
	}
	
	/*
	 * Allows mocking for tests
	 */
	AuditEnforcingTaskSchedulerWrapper(AuditServerHttpClient client) {
		this.client = client;
	}
	
	@Override
	public Configuration getConf() {
		return configuration;
	}

	@Override
	public void setConf(Configuration configuration) {
		//create the actual scheduler and move on
	    Class<? extends TaskScheduler> schedulerClass = configuration.getClass("auditable.mapreduce.actualTaskScheduler", JobQueueTaskScheduler.class, TaskScheduler.class);
	    actualScheduler = (TaskScheduler) ReflectionUtils.newInstance(schedulerClass, configuration);
	    
	    if (client == null) {
	    	client = new AuditServerHttpClient(configuration.get("auditable.mapreduce.auditserverBaseUrl"));
	    }
		
		this.configuration = configuration;
		
		actualScheduler.setConf(configuration);
	}

	@Override
	public synchronized void setTaskTrackerManager(TaskTrackerManager taskTrackerManager) {
		actualScheduler.setTaskTrackerManager(taskTrackerManager);
	}

	@Override
	public void start() throws IOException {
		actualScheduler.start();
	}

	@Override
	public void terminate() throws IOException {
		actualScheduler.terminate();
	}

	@Override
	public List<Task> assignTasks(TaskTracker taskTracker) throws IOException {
		return actualScheduler.assignTasks(taskTracker);
	}

	@Override
	public Collection<JobInProgress> getJobs(String queueName) {
		return actualScheduler.getJobs(queueName);
	}

	@Override
	public void refresh() throws IOException {
		actualScheduler.refresh();
	}

	@Override
	public void checkJobSubmission(JobInProgress job) throws IOException {
		actualScheduler.checkJobSubmission(job);
		
		String jobJarFilename = job.getJobConf().get("mapred.jar");
		String allJarFilenames = jobJarFilename == null ? "" : jobJarFilename + ":";
		String cpJarFilenames = job.getJobConf().get("mapred.job.classpath.files");
		if (cpJarFilenames != null) {
			allJarFilenames += cpJarFilenames;
		}
		String[] allJars = allJarFilenames.split(":");
		
		//for now, challenge that audit server for each jar on the classpath
		//perhaps we should enable the server to accept challenges for a list of jars
		for (String someJar : allJars) {
			Path file = new Path(someJar);
			FileSystem fs = FileSystem.get(job.getJobConf());
			FSDataInputStream inputStream = fs.open(file);
			
			String user = job.getJobConf().get("user.name");
			String token = job.getJobConf().get("auditable.mapreduce.sessionToken");
			String sha1 = DigestUtils.shaHex(inputStream);
			String jarName = file.getName();
			
			inputStream.close();
			
			if (token == null || user == null) {
				log.warn("Rejecting job submission without audit token.");
				throw new IOException("Rejecting job submission without audit token.");
			} else if (client.challengeServer(user, token, jarName, sha1) == AuditServerResponse.NOK) {
				log.warn("Job submission failed audit server check. token=" + token + "; JAR name=" + jarName + "; SHA1=" + sha1);
				throw new IOException("Job submission failed audit server check. token=" + token + "; JAR name=" + jarName + "; SHA1=" + sha1);
			}
		}
		
		job.getJobConf().set("auditable.mapreduce.sessionToken", "");
	}
}